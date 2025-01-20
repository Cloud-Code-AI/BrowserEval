import { MetricCategory } from "../core/request";

export interface Metric {
    metricName: string;
    category: MetricCategory;
    compute: any //(sampleIds: string[], responses: any[][], formatted_docs: Doc[], metrics: Metric[]) => any[];
}