// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as net from "net";
import * as path from "path";
import * as vscode from "vscode";
import { DidChangeConfigurationNotification, LanguageClientOptions } from "vscode-languageclient";
import { LanguageClient, StreamInfo } from "vscode-languageclient/node";
import { GradleProjectContentProvider } from "../projectContent/GradleProjectContentProvider";
import { GetProjectsReply } from "../proto/gradle_pb";
import {
    getConfigGradleJavaHome,
    getConfigJavaImportGradleHome,
    getConfigJavaImportGradleUserHome,
    getConfigJavaImportGradleVersion,
    getConfigJavaImportGradleWrapperEnabled,
} from "../util/config";
const CHANNEL_NAME = "Gradle for Java (Language Server)";

export let isLanguageServerStarted = false;

export async function startLanguageServer(
    context: vscode.ExtensionContext,
    contentProvider: GradleProjectContentProvider
): Promise<void> {
    void vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, (progress) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return new Promise<void>(async (resolve, _reject) => {
            progress.report({
                message: "Initializing Gradle Language Server",
            });
            const clientOptions: LanguageClientOptions = {
                documentSelector: [{ scheme: "file", language: "gradle" }],
                outputChannel: vscode.window.createOutputChannel(CHANNEL_NAME),
                outputChannelName: CHANNEL_NAME,
                initializationOptions: {
                    settings: getGradleSettings(),
                },
            };
            let serverOptions;
            if (process.env.VSCODE_DEBUG_LANGUAGE_SERVER === "true") {
                // debug mode
                const port = process.env.VSCODE_GRADLE_PORT;
                if (!port) {
                    void vscode.window.showErrorMessage(
                        "VSCODE_GRADLE_PORT is invalid, please check it in launch.json."
                    );
                    return;
                }
                serverOptions = awaitServerConnection.bind(null, port);
            } else {
                // keep consistent with gRPC server
                const javaHome = getConfigGradleJavaHome() || process.env.JAVA_HOME;
                if (!javaHome) {
                    void vscode.window
                        .showErrorMessage(
                            'There is no valid JAVA_HOME setting to launch Gradle Language Server. Please check your "java.home" setting.',
                            "Open Settings"
                        )
                        .then((answer) => {
                            if (answer === "Open Settings") {
                                void vscode.commands.executeCommand("workbench.action.openSettings", "java.home");
                            }
                        });
                    return;
                }
                const args = ["-jar", path.resolve(context.extensionPath, "lib", "gradle-language-server.jar")];
                serverOptions = {
                    command: path.join(javaHome, "bin", "java"),
                    args: args,
                };
            }
            const languageClient = new LanguageClient("gradle", "Gradle Language Server", serverOptions, clientOptions);
            void languageClient.onReady().then(
                () => {
                    isLanguageServerStarted = true;
                    void handleLanguageServerStart(contentProvider);
                    resolve();
                },
                (e) => {
                    void vscode.window.showErrorMessage(e);
                }
            );
            const disposable = languageClient.start();
            context.subscriptions.push(disposable);
            context.subscriptions.push(
                vscode.workspace.onDidChangeConfiguration((e) => {
                    if (e.affectsConfiguration("java.import.gradle")) {
                        languageClient.sendNotification(DidChangeConfigurationNotification.type, {
                            settings: getGradleSettings(),
                        });
                    }
                })
            );
        });
    });
}

async function awaitServerConnection(port: string): Promise<StreamInfo> {
    const addr = parseInt(port);
    return new Promise((resolve, reject) => {
        const server = net.createServer((stream) => {
            server.close();
            resolve({ reader: stream, writer: stream });
        });
        server.on("error", reject);
        server.listen(addr, () => {
            server.removeListener("error", reject);
        });
        return server;
    });
}

function getGradleSettings(): unknown {
    return {
        gradleHome: getConfigJavaImportGradleHome(),
        gradleVersion: getConfigJavaImportGradleVersion(),
        gradleWrapperEnabled: getConfigJavaImportGradleWrapperEnabled(),
        gradleUserHome: getConfigJavaImportGradleUserHome(),
    };
}

export async function syncLanguageServer(projectPath: string, projectContent: GetProjectsReply): Promise<void> {
    if (isLanguageServerStarted) {
        await vscode.commands.executeCommand("gradle.setPlugins", projectPath, projectContent.getPluginsList());
        const closures = projectContent.getPluginclosuresList().map((value) => {
            const JSONMethod = value.getMethodsList().map((method) => {
                return {
                    name: method.getName(),
                    parameterTypes: method.getParametertypesList(),
                    deprecated: method.getDeprecated(),
                };
            });
            const JSONField = value.getFieldsList().map((field) => {
                return {
                    name: field.getName(),
                    deprecated: field.getDeprecated(),
                };
            });
            return {
                name: value.getName(),
                methods: JSONMethod,
                fields: JSONField,
            };
        });
        await vscode.commands.executeCommand("gradle.setClosures", projectPath, closures);
        await vscode.commands.executeCommand(
            "gradle.setScriptClasspaths",
            projectPath,
            projectContent.getScriptclasspathsList()
        );
    }
}

async function handleLanguageServerStart(contentProvider: GradleProjectContentProvider): Promise<void> {
    if (isLanguageServerStarted) {
        const folders = vscode.workspace.workspaceFolders;
        if (folders?.length) {
            // TODO: support multiple workspaces
            const projectPath = folders[0].uri.fsPath;
            // when language server starts, it knows nothing about the project
            // here to asynchronously sync the project content (plugins, closures) with language server
            const projectContent = await contentProvider.getProjectContent(projectPath, path.basename(projectPath));
            if (projectContent) {
                await syncLanguageServer(projectPath, projectContent);
            }
        }
    }
}
