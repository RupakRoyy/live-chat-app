type AuthFieldProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
};

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-snow">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-charcoal/50 px-3.5 py-2.5 text-sm text-snow placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}
