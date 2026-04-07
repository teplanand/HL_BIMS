import { useDispatch, useSelector } from 'react-redux'
import { removeModal, setModal } from '../redux/components'
 import moment from 'moment'
import { Box } from 'framer-motion'
 
export const useModal = () => {

  // Removed blankLayout due to JSX in .ts file

  const dispatch = useDispatch()
   const modal = useSelector((state: any) => state.components.modal)

  const lastmodalopen = modal[modal?.length - 1]

  const openModal = (params: any) => {
    dispatch(setModal([
      ...modal, {
        visible: true,
        modalkey: moment().unix(), ...params,
      },
    ]))
  }
  const closeModal = () => {
    const lastmodal = modal[modal?.length - 1]
    dispatch(removeModal(lastmodal?.modalkey))
  }

  return {
    openModal,
    closeModal,
    modal,
    lastmodal: lastmodalopen,
    isOpen: lastmodalopen?.visible || false,
  }
}
