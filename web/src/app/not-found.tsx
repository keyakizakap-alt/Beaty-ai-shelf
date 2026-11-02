import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-serif text-5xl text-accent">404</p>
      <h1 className="mt-4 text-xl font-bold">ページが見つかりませんでした</h1>
      <p className="mt-2 text-sm text-ink-2">URLが間違っているか、ページが移動した可能性があります。</p>
      <div className="mt-8">
        <ButtonLink href="/">トップへ戻る</ButtonLink>
      </div>
    </main>
  );
}
