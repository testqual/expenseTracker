import { useEffect, useState } from 'react'
import './App.css'

const defaultForm = {
  amount: '',
  description: '',
  category: 'food',
  date: '',
}

const categories = ['food', 'transport', 'utilities', 'entertainment', 'other']

const formatMonth = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function App() {
  const [formData, setFormData] = useState(defaultForm)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const monthlyTotals = Object.entries(
    expenses.reduce((totals, expense) => {
      const month = formatMonth(expense.date)
      totals[month] = totals[month] || {}
      totals[month][expense.category] = (totals[month][expense.category] || 0) + expense.amount
      return totals
    }, {})
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setFormData(defaultForm)
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.amount || !formData.description || !formData.date) {
      setError('Amount, description and date are required.')
      return
    }

    const payload = {
      amount: parseFloat(formData.amount),
      description: formData.description.trim(),
      category: formData.category,
      date: formData.date,
    }

    try {
      const endpoint = editId ? `/api/expenses/${editId}` : '/api/expenses'
      const method = editId ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save expense')
      }

      const savedExpense = editId ? await response.json() : await response.json()
      setExpenses((prev) => {
        if (editId) {
          return prev.map((item) => (item.id === editId ? savedExpense : item))
        }
        return [...prev, savedExpense]
      })

      setFormData(defaultForm)
      setEditId(null)
      setShowForm(false)
      setSuccess(editId ? 'Expense updated.' : 'Expense added.')
    } catch (err) {
      setError('Could not save expense. Please try again.')
    }
  }

  const handleEdit = (expense) => {
    setEditId(expense.id)
    setFormData({
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
    })
    setShowForm(true)
    setError('')
    setSuccess('Editing selected expense.')
  }

  const handleDelete = async (id) => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      setExpenses((prev) => prev.filter((expense) => expense.id !== id))
      if (editId === id) {
        handleCancelEdit()
      }
      setSuccess('Expense deleted.')
    } catch (err) {
      setError('Could not delete expense. Please try again.')
    }
  }

  return (
    <main className="app-shell">
      {showForm && (
        <section className="expense-panel">
          <h1>{editId ? 'Edit Expense' : 'Create Expense'}</h1>
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
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
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

          <div className="form-actions">
            <button type="submit" className="submit-button">
              {editId ? 'Save Changes' : 'Add Expense'}
            </button>
            {showForm && (
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>
      </section>
      )}

      <section className="expense-list">
        <div className="expense-list-header">
          <h2>Expense History</h2>
          <div className="header-buttons">
            <button type="button" className="theme-toggle" onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {!showForm && (
              <button type="button" className="create-button" onClick={() => setShowForm(true)}>
                Create Expense
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <p>Loading expenses…</p>
        ) : expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          <ul>
            {expenses
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((expense) => (
                <li key={expense.id}>
                  <div className="expense-row">
                    <div>
                      <strong>{expense.description}</strong>
                      <span>{expense.category}</span>
                    </div>
                    <div>
                      <span>${expense.amount.toFixed(2)}</span>
                      <time dateTime={expense.date}>{expense.date}</time>
                    </div>
                  </div>
                  <div className="expense-actions">
                    <button type="button" onClick={() => handleEdit(expense)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(expense.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="monthly-summary">
        <h2>Monthly Category Totals</h2>
        {monthlyTotals.length === 0 ? (
          <p>No totals to show yet.</p>
        ) : (
          monthlyTotals.map(([month, totals]) => (
            <div key={month} className="month-block">
              <h3>{month}</h3>
              <ul>
                {categories.map((category) => (
                  <li key={category}>
                    <strong>{category.charAt(0).toUpperCase() + category.slice(1)}:</strong>
                    <span>${(totals[category] || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  )
}

export default App
