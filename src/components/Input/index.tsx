const Input = ({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (e: any) => void;
  value: string;
}) => {
  return (
    <div className="flex flex-1 flex-col">
      <label
        htmlFor="first_name"
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white text-left">
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        type="text"
        id="first_name"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        required
      />
    </div>
  );
};

export default Input;
