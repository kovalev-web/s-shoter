export function BoardEmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <p className="rounded-md bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-border">
        Установи расширение и сделай первый скриншот
      </p>
    </div>
  );
}
