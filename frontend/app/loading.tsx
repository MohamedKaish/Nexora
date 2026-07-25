import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <Image src="/favicon.svg" alt="TruthLens AI" width={56} height={56} />
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-scan rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
