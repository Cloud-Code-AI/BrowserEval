import { Metric } from "../metrics/metrics";
import { SampleUid, MetricCategory } from "./request";
import { Model } from "./model";
import { EvaluationTracker } from "../config";


export interface TaskConfig {
    name: string;
    metrics: string[];
}


export abstract class Task {
    cfg: TaskConfig;
    abstract metrics: Metric[];
    abstract loadDataset(): Promise<any>;
    abstract *evalDocs(): Generator<any>;
        hasMetricCategory: Record<MetricCategory, boolean> = Object.values(MetricCategory).reduce((acc,cat)=> {
        acc[cat] = this.metrics.some(m=> m.category == cat)
       return acc
    }, {} as Record<MetricCategory, boolean> );
        abstract getMetricMethodFromCategory(metricCategory: MetricCategory): any;

    constructor(config: TaskConfig) {
        this.cfg = config;
    }
      abstract createDocumentFromSample(
        sample: any,
        sampleIndex: number,
        model: Model,
        numFewShotSeeds: number,
       evaluationTracker: EvaluationTracker,
        useChatTemplate: boolean,
        systemPrompt: string | null,
    ): Promise<TaskDoc>;
     static async loadDatasets(tasks: Task[]): Promise<void> {
         await Promise.all(tasks.map((t)=> t.loadDataset()))
    }
}

export type TaskDoc = {
  query: string,
    instruction?: string,
    ctx?: string,
    choices?: string[],
    gold_index?: number | number[],
    num_asked_few_shots?:number,
    num_effective_few_shots?:number,
    specific?:Record<string, any>,
    original_query?: string,
        unconditioned_query?: string
    doc_id_seed?:number
}