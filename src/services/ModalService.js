import { modals } from '@/modals'
import { outputSchema } from '@/schema/modelOutput'

export class ModalService {
  activeModal = null

  selectModal(modalName, apiKey) {
    if (modals[modalName]) {
      this.activeModal = modals[modalName]
      this.activeModal.init(apiKey)
    } else {
      throw new Error(`Modal "${modalName}" not found`)
    }
  }

  async generate(props) {
    if (!this.activeModal) {
      throw new Error('No modal selected')
    }
    return this.activeModal.generateResponse(props)
  }
}