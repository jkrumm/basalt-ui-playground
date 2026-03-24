interface BPMNStubProps {
  src: string
}

export function BPMNStub({ src }: BPMNStubProps) {
  return (
    <div className="mdx-diagram-stub">
      <span>
        BPMN diagram:
        {src}
      </span>
    </div>
  )
}
