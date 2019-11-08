# vscode-gradle

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/richardwillis.vscode-gradle.svg)](https://marketplace.visualstudio.com/items?itemName=richardwillis.vscode-gradle)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/richardwillis.vscode-gradle.svg)](https://marketplace.visualstudio.com/items?itemName=richardwillis.vscode-gradle)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/richardwillis.vscode-gradle.svg)](https://marketplace.visualstudio.com/items?itemName=richardwillis.vscode-gradle)

Run gradle tasks in VS Code.

![Screencat](images/screencast.gif)

## Features

- Run gradle tasks as [VS Code tasks](https://code.visualstudio.com/docs/editor/tasks)
- List & run gradle tasks in the Explorer
- Multi-root workspaces supported
- Default Groovy/Kotlin and custom build files supported

> **Note:** Local gradle wrapper executables must exist at the root of the workspace folders (either `./gradlew` or `.\gradlew.bat`, depending on your environment).

## Extension Settings

This extension contributes the following settings:

- `gradle.autoDetect`: Automatically detect gradle tasks
- `gradle.tasksArgs`: Custom gradle tasks arguments
- `gradle.enableTasksExplorer`: Enable an explorer view for gradle tasks
- `gradle.customBuildFile`: Custom gradle build filename

## Slow Task Provider Warning

[Since vscode v1.40](https://code.visualstudio.com/updates/v1_40#_slow-task-provider-warning), you will start seeing warning notifications when the gradle task provider takes too long.

<img src="./images/slow-task-provider-warning.png" width="400" />

It can take a while to refresh the gradle tasks, so you should permanently ignore this warning by clicking on "Don't warn again for gradle tasks", or add the following to your `settings.json`:

```json
"task.slowProviderWarning": [
  "gradle"
]
```

## Credits

- Originally forked from [Cazzar/vscode-gradle](https://github.com/Cazzar/vscode-gradle)
- Heavily inspired by the built-in [npm extension](https://github.com/microsoft/vscode/tree/master/extensions/npm)

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md)

## License

See [LICENSE.md](./LICENSE.md)
