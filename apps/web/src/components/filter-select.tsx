'use client'

interface FilterSelectProps {
  name: string
  current: string
  options: { value: string; label: string }[]
}

export function FilterSelect({ name, current, options }: FilterSelectProps) {
  return (
    <form method="get" className="w-full">
      <select
        name={name}
        value={current}
        onChange={(e) => {
          const form = e.target.form!
          const formData = new FormData(form)
          const params = new URLSearchParams()
          
          for (const [key, value] of formData.entries()) {
            if (value && value !== 'all') {
              params.set(key, value.toString())
            }
          }
          
          window.location.href = `/history?${params.toString()}`
        }}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  )
}