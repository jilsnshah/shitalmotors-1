import 'react'

declare module 'react' {
  interface HTMLAttributes<T> {
    /** React 18 passes unknown attributes through; '' sets the boolean attribute. */
    inert?: '' | undefined
  }
}
