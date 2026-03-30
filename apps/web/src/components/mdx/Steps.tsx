interface StepsProps {
  children: React.ReactNode;
}

interface StepProps {
  title: string;
  children: React.ReactNode;
}

export function Steps({ children }: StepsProps) {
  return <ol className="mdx-steps">{children}</ol>;
}

export function Step({ title, children }: StepProps) {
  return (
    <li className="mdx-step">
      <strong className="mdx-step-title">{title}</strong>
      <div className="mdx-step-content">{children}</div>
    </li>
  );
}
