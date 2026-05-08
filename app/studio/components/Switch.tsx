"use client";
import { useState } from "react";

export default function Switch({
  name, defaultChecked = false, label, hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="stu-switch">
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
      <span className="stu-switch__track" />
      <span>
        <span className="stu-switch__label">{label}</span>
        {hint && <span className="stu-switch__hint">{hint}</span>}
      </span>
    </label>
  );
}
