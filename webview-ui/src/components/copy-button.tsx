import { useCopyToClipboard } from "../hooks/use-copy-to-clipboard";
import { cn } from "../lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import Tick from "./icons/tick";
import Copy from "./icons/copy";

const copyButtonVariants = cva(
  "relative group rounded-full p-1.5 transition-all duration-75",
  {
    variants: {
      variant: {
        default:
          "bg-transparent hover:bg-gray-100 dark:hover:bg-accent active:bg-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function CopyButton({
  variant = "default",
  value,
  className,
}: {
  value: string;
  className?: string;
  successMessage?: string;
} & VariantProps<typeof copyButtonVariants>) {
  const [copied, copyToClipboard] = useCopyToClipboard();
  return (
    <button
      onClick={(e) => {
        copyToClipboard(value);
      }}
      className={cn(copyButtonVariants({ variant }), className)}
      type="button"
    >
      <span className="sr-only">Copy</span>
      {copied ? <Tick className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
