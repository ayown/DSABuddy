import { ModalInterface } from '../interface/ModalInterface'

export class BaseModal extends ModalInterface {
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