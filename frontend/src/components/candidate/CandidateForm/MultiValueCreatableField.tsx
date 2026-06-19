import OutlookSearchSelect from '@/components/ui/OutlookSearchSelect';

type StringOption = {
  value: string;
  label?: string;
};

interface MultiValueCreatableFieldProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

const toOptions = (values: string[]): StringOption[] =>
  values.map((value) => ({ value, label: value }));

export default function MultiValueCreatableField({
  label,
  placeholder,
  values,
  onChange,
  disabled = false,
}: MultiValueCreatableFieldProps) {
  const selectedItems = toOptions(values);

  return (
    <OutlookSearchSelect<StringOption>
      label={label}
      placeholder={placeholder}
      initialItems={selectedItems}
      searchApi={async (search) => ({
        data: selectedItems.filter((item) =>
          item.value.toLowerCase().includes(search.toLowerCase())
        ),
      })}
      displayFn={(item) => item.label || item.value || ''}
      chipDisplayFn={(item) => item.label || item.value || ''}
      keyProp="value"
      onChange={(_ids, items) => {
        const nextValues = items
          .map((item) => (item.value || item.label || '').trim())
          .filter(Boolean);
        onChange(Array.from(new Set(nextValues)));
      }}
      disabled={disabled}
      allowCreation={true}
      commitOnBlur={true}
    />
  );
}