import { Task } from "./task";

export class Registry {
    tasks: Record<string, Task> = {};

    registerTask(name: string, task: Task) {
        this.tasks[name] = task;
    }

    getTask(name: string): Task {
      if (!this.tasks[name]){
            throw new Error(`Task ${name} does not exist in the registry. Please, use registry.registerTask()`)
        }
        return this.tasks[name];
    }
     hasTask(name:string): boolean {
        return name in this.tasks
    }

    getTaskDict(taskNames: string[]): Record<string, Task> {
        const taskDict: Record<string, Task> = {};
        for (const taskName of taskNames) {
            taskDict[taskName] = this.getTask(taskName);
        }
        return taskDict;
    }

    get allTasks(){
        return Object.values(this.tasks)
    }
}

export function taskinfoSelector(tasks: string, registry: Registry): [string[], Record<string, [number, any][]>] {
      const taskNamesList: string[] = [];
    const fewshotsDict: Record<string, [number, any][]> = {};
    const taskStrings = tasks.split(",").map(t => t.trim())
    for (const taskString of taskStrings) {
          let fewshots = 0
        let task = taskString
        if (taskString.includes("|")){
            [task, fewshots] = taskString.split("|")
        }
         if (!registry.hasTask(task)) {
           throw new Error(`Task ${task} is not registred. Please register this task through the registerTask() method of the registry`)
         }
       taskNamesList.push(task)
        if (!fewshotsDict[task]){
          fewshotsDict[task] = []
        }
        fewshotsDict[task].push([Number(fewshots) || 0, null])


    }

    return [taskNamesList, fewshotsDict]
}