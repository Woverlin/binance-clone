const Input = ({
  label,
  onChange,
  value,
  type = "text",
}: {
  type?: "text" | "number";
  label: string;
  onChange: (e: any) => void;
  value: string | number;
}) => {
  const onChangeInput = (e: any) => {
    if (type !== "number") {
      onChange(e);
      return;
    }
    // if value is not blank, then test the regex
    if (e.target.value === '' || +e.target.value >= 0) {
      onChange(e);
    }
  }
  return (
    <div className="flex flex-1 flex-col dark">
      <label
        htmlFor="first_name"
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white text-left">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChangeInput}
        id="first_name"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        required
      />
    </div>
  );
};

export default Input;
