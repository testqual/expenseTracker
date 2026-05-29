import { useEffect, useState } from 'react'
import './App.css'

const defaultForm = {
  amount: '',
  description: '',
  category: 'food',
  date: '',
}

function App() {
  const [formData, setFormData] = useState(defaultForm)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const response = await fetch('/api/expenses')
        if (!response.ok) {
          throw new Error('Unable to load expenses')
        }
        const data = await response.json()
        setExpenses(data)
      } catch (err) {
        setError('Could not load expenses from server.')
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.amount || !formData.description || !formData.date) {
      return
    }

    const newExpense = {
      amount: parseFloat(formData.amount),
      description: formData.description.trim(),
      category: formData.category,
      date: formData.date,
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpense),
      })

      if (!response.ok) {
        throw new Error('Failed to save expense')
      }

      const savedExpense = await response.json()
      setExpenses((prev) => [...prev, savedExpense])
      setFormData(defaultForm)
      setError('')
    } catch (err) {
      setError('Could not save expense. Please try again.')
    }
  }

  return (
    <main className="app-shell">
      <section className="expense-panel">
        <h1>Add New Expense</h1>
        <form className="expense-form" onSubmit={handleSubmit}>
          <label>
            Amount
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 42.50"
              required
            />
          </label>

          <label>
            Description
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Groceries"
              required
            />
          </label>

          <label>
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="submit-button">
            Add Expense
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </section>

      <section className="expense-list">
        <h2>Expense History</h2>
        {loading ? (
          <p>Loading expenses…</p>
        ) : expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          <ul>
            {expenses.map((expense) => (
              <li key={expense.id}>
                <div>
                  <strong>{expense.description}</strong>
                  <span>{expense.category}</span>
                </div>
                <div>
                  <span>${expense.amount.toFixed(2)}</span>
                  <time dateTime={expense.date}>{expense.date}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
