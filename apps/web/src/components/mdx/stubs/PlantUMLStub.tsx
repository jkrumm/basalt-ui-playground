interface PlantUMLStubProps {
  src: string;
}

export function PlantUMLStub({ src }: PlantUMLStubProps) {
  return (
    <div className="mdx-diagram-stub">
      <span>
        PlantUML diagram:
        {src}
      </span>
    </div>
  );
}
