export default function EditorsNote({
  date,
  body,
}: {
  date?: string;
  body: string;
}) {
  const stamp = date ?? new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());
  return (
    <p className="adm-editors-note">
      <span>Editor's note · {stamp}</span>
      {body}
    </p>
  );
}
