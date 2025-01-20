import { Model } from './model';
import { Task, TaskDoc } from './task';
import { Registry, taskinfoSelector } from './registry';
import { MetricCategory, SampleUid } from "./request";
import { EvaluationTracker, PipelineParameters } from "../config";
import { applyGenerativeMetric, apply_llm_as_judge_metric, apply_multichoice_metric, apply_multichoice_metric_one_token, apply_perplexity_metric, apply_target_perplexity_metric } from '../metrics/metrics';

interface SampleResponse {
    sampleId: SampleUid;
    metricCategory: MetricCategory;
    responses: any[];
}

export class Pipeline {
    pipelineParameters: PipelineParameters;
    model: Model;
    evaluationTracker: EvaluationTracker;
    taskNamesList: string[];
    taskDict: Record<string, Task>;
    fewshotDict: Record<string, [number, any][]>;
      docs: Record<number, TaskDoc>
    constructor(
        tasks: string,
        pipelineParameters: PipelineParameters,
        evaluationTracker: EvaluationTracker,
        model: Model,
    ) {
      this.pipelineParameters = pipelineParameters;
        this.model = model;
        this.evaluationTracker = evaluationTracker;
        const registry = new Registry();
        [this.taskNamesList, this.fewshotDict] = taskinfoSelector(tasks, registry);
       this.taskDict = registry.getTaskDict(this.taskNamesList)
       this.evaluationTracker.generalConfigLogger.logModelInfo(this.model.modelInfo);
        this.docs = {}
         this.initTasksAndDocuments().then(() => {
             this.initRandomSeeds();
             this.evaluationTracker.generalConfigLogger.logArgsInfo({
                numFewshotSeeds: this.pipelineParameters.numFewshotSeeds,
               maxSamples: this.pipelineParameters.maxSamples,
                 overrideBatchSize: this.pipelineParameters.overrideBatchSize
          })
        });
    }

    async initTasksAndDocuments(): Promise<void> {
           await Task.loadDatasets(Object.values(this.taskDict));
        this.evaluationTracker.taskConfigLogger.log(this.taskDict);

            for (const taskName of this.taskNamesList){
           const task = this.taskDict[taskName]
            for (const [fewshots, _] of this.fewshotDict[taskName]) {
                 for (const [ix, sample] of this.evalDocs(task)){
                      const doc_id_seed = ix + fewshots
                    this.docs[doc_id_seed] =  await task.createDocumentFromSample(
                    sample,
                   doc_id_seed,
                  this.model,
                   this.pipelineParameters.numFewshotSeeds,
                     this.evaluationTracker,
                     this.pipelineParameters.useChatTemplate,
                    this.pipelineParameters.systemPrompt,
                  );
                   }
              }
          }
     }

       *evalDocs(task: Task): Generator<[number, any]> {
            let ix = 0;
            for (const sample of task.evalDocs()) {
              if (this.pipelineParameters.maxSamples && ix >= this.pipelineParameters.maxSamples) {
                    break;
                }
              yield [ix, sample]
              ix++
            }

    }

   initRandomSeeds(): void {
        console.log("--- INIT SEEDS ---")
        Math.random()
        //TODO: add seed logic if needed.
    }
    async evaluate(): Promise<void> {
        console.log("--- START EVALUATION ---")
        const sampleIdToResponses = await this.runModel();
       await this.computeMetrics(sampleIdToResponses)
       this.evaluationTracker.generalConfigLogger.logEndTime();
        this.evaluationTracker.metricsLogger.aggregate(this.taskDict);
       this.evaluationTracker.detailsLogger.aggregate()
        console.log("--- END EVALUATION ---")

    }


    async runModel(): Promise<Record<string, SampleResponse[]>> {
      const sampleIdToResponses:  Record<string, SampleResponse[]> = {}

          for (const doc_id_seed in this.docs){
              const doc = this.docs[doc_id_seed]
              const shortTaskName = doc.query.rsplit("|",1)[0]
                for (const m of this.taskDict[shortTaskName].metrics){

                     const prediction = await this.callModel(doc.query, doc, m.category)

                     if (!sampleIdToResponses[JSON.stringify({sampleId: {taskName: shortTaskName, sampleIndex : parseInt(doc_id_seed)}, metricCategory : m.category})]){
                        sampleIdToResponses[JSON.stringify({sampleId: {taskName: shortTaskName, sampleIndex : parseInt(doc_id_seed)}, metricCategory : m.category})] = []
                    }
                     sampleIdToResponses[JSON.stringify({sampleId: {taskName: shortTaskName, sampleIndex : parseInt(doc_id_seed)}, metricCategory : m.category})].push({sampleId : {taskName: shortTaskName, sampleIndex : parseInt(doc_id_seed)}, metricCategory: m.category, responses : [prediction]})


               }
          }

        return sampleIdToResponses;
    }

    async callModel(context: string, doc:TaskDoc, metricCategory:MetricCategory): Promise<any>{
      
          switch (metricCategory){
              case "MULTICHOICE":
                  return this.model.generate(context);
              case "MULTICHOICE_ONE_TOKEN":
                    return this.model.generate(context);
                  case "GENERATIVE":
                    case "GENERATIVE_SAMPLING":
                        return this.model.generate(context, {
                              stopSequence: doc.specific?.stopSequence,
                              generationSize: doc.specific?.generationSize,
                              doSample:  doc.specific?.doSample
                    });
                case "PERPLEXITY":
                case "TARGET_PERPLEXITY":
                    return this.model.generate(context);
                    case "LLM_AS_JUDGE":
                     case "LLM_AS_JUDGE_MULTI_TURN":
                        return this.model.generate(context);

             default:
                  throw new Error("method does not exist for this task")
          }

    }

    async computeMetrics(sampleIdToResponses:  Record<string, SampleResponse[]>): Promise<void> {
           console.log("--- COMPUTING METRICS ---")
          const taskMetricCategoryGroups :Record<string,Record<MetricCategory,any>> = {}

         for (const key in sampleIdToResponses){
            const {sampleId, metricCategory} = JSON.parse(key)
           const shortTaskName = sampleId.taskName.rsplit("|",1)[0]
             if (!taskMetricCategoryGroups[shortTaskName]){
                 taskMetricCategoryGroups[shortTaskName] = {} as Record<MetricCategory,any>
            }
             if (!taskMetricCategoryGroups[shortTaskName][metricCategory]){
                  taskMetricCategoryGroups[shortTaskName][metricCategory] = {
                     ids:[],
                      responses:[],
                       docs:[]
                 }
             }

         taskMetricCategoryGroups[shortTaskName][metricCategory]["ids"].push(sampleId.sampleIndex);
        taskMetricCategoryGroups[shortTaskName][metricCategory]["responses"].push(sampleIdToResponses[key].map(s=>s.responses[0]));
            taskMetricCategoryGroups[shortTaskName][metricCategory]["docs"].push(this.docs[sampleId.sampleIndex]);
        }

        for (const taskName in taskMetricCategoryGroups){
            const shortTaskName = taskName.rsplit("|",1)[0]
               const task = this.taskDict[shortTaskName]
              const samplesPerMetric = taskMetricCategoryGroups[taskName]

                  for (const metricCategory in samplesPerMetric){
                         const samples = samplesPerMetric[metricCategory as any]
                      const sampleIds = samples.ids
                      const responses = samples.responses
                      const docs = samples.docs
                     const metricFunction = task.getMetricMethodFromCategory(metricCategory as any)
                     const metricCategoryMetrics = task.metrics.filter(m => m.category === metricCategory)

                          let outputs;
                           switch (metricCategory) {
                            case MetricCategory.MULTICHOICE:
                               outputs = apply_multichoice_metric(sampleIds, responses, docs, metricCategoryMetrics)
                                break;
                            case MetricCategory.MULTICHOICE_ONE_TOKEN:
                                outputs = apply_multichoice_metric_one_token(sampleIds, responses, docs, metricCategoryMetrics)
                                break;
                            case MetricCategory.GENERATIVE:
                                 case MetricCategory.GENERATIVE_SAMPLING:
                                  outputs = applyGenerativeMetric(sampleIds, responses, docs, metricCategoryMetrics);
                                break;
                               case MetricCategory.PERPLEXITY:
                                    outputs = apply_perplexity_metric(sampleIds, responses, docs, metricCategoryMetrics);
                                     break;
                                  case MetricCategory.TARGET_PERPLEXITY:
                                   outputs = apply_target_perplexity_metric(sampleIds, responses, docs, metricCategoryMetrics);
                                   break;
                              case MetricCategory.LLM_AS_JUDGE:
                              case MetricCategory.LLM_AS_JUDGE_MULTI_TURN:
                                   outputs = apply_llm_as_judge_metric(sampleIds, responses, docs, metricCategoryMetrics)
                                  break;
                               default:
                                   throw new Error("This metric category is not yet supported");
                        }

                 for (const [output, doc, response ] of responses.map((r, ix) => [outputs[ix], docs[ix], r])){
                        this.evaluationTracker.metricsLogger.log(taskName, output)
                       this.evaluationTracker.detailsLogger.log(taskName, task, doc, response, output);
                   }

                  }
          }
    }

    async saveAndPushResults() {
         console.log("--- SAVING AND PUSHING RESULTS ---")
            this.evaluationTracker.save();
    }

      async showResults() {
        this.evaluationTracker.generateFinalDict()
        console.table(this.evaluationTracker.final_dict)
          console.log(this.evaluationTracker.final_dict)
    }
    
      getResults() {
          this.evaluationTracker.generateFinalDict();
          return this.evaluationTracker.final_dict;
      }
}