export class TaskTimer {
  private taskStartTimes: Record<string, Date>;
  private parents: string[];
  private level: number;

  constructor() {
    this.taskStartTimes = {};
    this.parents = [];
    this.level = 0;
  }

  start(task: string) {
    this.taskStartTimes[task] = new Date();
    console.log(`${this.getIndentString()}starting "${task}"...`);
  }

  finish(task: string) {
    const startTime = this.taskStartTimes[task];

    if (this.parents.includes(task)) {
      this.level--;
    }

    console.log(
      `${this.getIndentString()}finished "${task}" in ${
        new Date().getTime() - startTime.getTime()
      } ms`
    );
  }

  startParent(task: string) {
    this.start(task);
    this.parents.push(task);
    this.level++;
  }

  private getIndentString() {
    return `${"  ".repeat(this.level)}|-- `;
  }
}
