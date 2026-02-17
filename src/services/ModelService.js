import { models } from '@/models'
import { outputSchema } from '@/schema/modelOutput'

export class ModelService {
  activeModel = null

  selectModel(modelName, apiKey, config = {}) {
    if (models[modelName]) {
      this.activeModel = models[modelName]
      this.activeModel.init(apiKey, config)
    } else {
      throw new Error(`Model "${modelName}" not found`)
    }
  }

  async generate(props) {
    if (!this.activeModel) {
      throw new Error('No model selected')
    }
    return this.activeModel.generateResponse(props)
  }
}