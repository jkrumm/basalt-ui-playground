interface ExcalidrawStubProps {
  src: string
}

export function ExcalidrawStub({ src }: ExcalidrawStubProps) {
  return (
    <div className="mdx-diagram-stub">
      <span>
        Excalidraw diagram:
        {src}
      </span>
    </div>
  )
}
