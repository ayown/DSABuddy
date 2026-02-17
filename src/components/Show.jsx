import { Spinner } from './ui/spinner'

// Props type removed for JS-only project.

/**
 * A component that conditionally renders its children based on the `show` prop.
 *
 * @param {Object} props - The component properties.
 * @param {boolean} props.show - Whether to show the children.
 * @param {React.ReactNode} props.children - The child elements to render.
 * @returns {React.ReactNode} - The rendered component.
 */
const Show = ({ show, children }) => {
  return show ? (
    children
  ) : (
    <div className='w-full h-full flex items-center justify-center'>
      <Spinner />
    </div>
  )
}
export default Show