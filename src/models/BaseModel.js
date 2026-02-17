import { ModelInterface } from '../interface/ModelInterface'

export class BaseModel extends ModelInterface {
  apiKey = ''

  init(apiKey) {
    this.apiKey = apiKey
  }

  async generateResponse(props) {
    return this.makeApiCall(props)
  }

  makeApiCall(props) {
    throw new Error('makeApiCall must be implemented in subclass')
  }
}