import { Metric, MetricCategory } from "./metrics";

export class PerplexityMetric implements Metric {
    metricName: string = "perplexity";
    category: MetricCategory = MetricCategory.PERPLEXITY;
     compute(logprobs: number[],referenceTexts: string[]): number {
        const sumLogprobs = logprobs.reduce((sum, cur) => sum + cur, 0);
         return Math.exp(-sumLogprobs / referenceTexts[0].length);
     }
}

export class TargetPerplexityMetric implements Metric {
    metricName: string = "ppl";
    category: MetricCategory = MetricCategory.TARGET_PERPLEXITY;
  
    compute(logprobs: number[], argmax_logits_eq_gold_list: number[],referenceTexts: string[] ,target_tokens: number[][]): number {
        const sumLogprobs = logprobs.reduce((sum, cur) => sum + cur, 0);
             return Math.exp(-sumLogprobs /  target_tokens.flat().length );
    }
}