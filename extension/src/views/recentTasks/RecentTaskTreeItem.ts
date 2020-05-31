import * as vscode from 'vscode';
import { GradleTaskTreeItem } from '..';
import { JavaDebug } from '../../config';
import { TaskTerminalsStore } from '../../stores';
import { GradleTaskDefinition } from '../../tasks';
import { getTreeItemState } from '../viewUtil';

function getRecentTaskTreeItemState(
  gradleTaskTreeItemState: string,
  numTerminals: number
): string {
  return numTerminals > 0
    ? `${gradleTaskTreeItemState}WithTerminals`
    : gradleTaskTreeItemState;
}

export class RecentTaskTreeItem extends GradleTaskTreeItem {
  constructor(
    parentTreeItem: vscode.TreeItem,
    task: vscode.Task,
    label: string,
    description: string,
    javaDebug: JavaDebug = { tasks: [] },
    private readonly taskTerminalsStore: TaskTerminalsStore
  ) {
    super(parentTreeItem, task, label, description || label, '', javaDebug);
  }

  public setContext(): void {
    const definition = this.task.definition as GradleTaskDefinition;
    this.tooltip =
      (definition.args ? `(args: ${definition.args}) ` : '') +
      (definition.description || this.label);
    const taskTerminalsStore = this.taskTerminalsStore.getItem(
      definition.id + definition.args
    );
    const numTerminals = taskTerminalsStore ? taskTerminalsStore.size : 0;
    this.description = `(${numTerminals})`;
    // const taskName = `${buildTaskName(definition)} (${numTerminals})`;
    // this.label = taskName;
    this.contextValue = getRecentTaskTreeItemState(
      getTreeItemState(this.task, this.javaDebug, definition.args),
      numTerminals
    );
    this.setIconState();
  }
}
