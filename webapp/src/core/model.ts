import { ModelInfo } from "../config";

export interface Model {
    modelInfo: ModelInfo;
    generate(
        context: string,
         options? : { stopSequence? :string[] , generationSize?:number, doSample? :boolean}
    ): Promise<string>;
}


export class LocalModel implements Model {
    modelInfo: ModelInfo
    modelConfig: any
    constructor(modelConfig: any){
        this.modelConfig = modelConfig;
         this.modelInfo = {
           modelName:modelConfig.model,
          modelSha:null,
           modelDtype:null,
            modelSize:null
        }
    }
  async  generate(context: string, options? : { stopSequence? :string[] , generationSize?:number, doSample? :boolean}): Promise<string> {
         throw new Error("This is a local model, please implement logic if you need to")
    }
}