import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 4000
const dataDir = path.resolve('data')
const dataPath = path.join(dataDir, 'expenses.json')

app.use(cors())
app.use(express.json())

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true })
  try {
    await fs.access(dataPath)
  } catch {
    await fs.writeFile(dataPath, '[]', 'utf8')
  }
}

async function readExpenses() {
  await ensureDataFile()
  const file = await fs.readFile(dataPath, 'utf8')
  return JSON.parse(file || '[]')
}

async function writeExpenses(expenses) {
  await ensureDataFile()
  await fs.writeFile(dataPath, JSON.stringify(expenses, null, 2), 'utf8')
}

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await readExpenses()
    res.json(expenses)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load expenses' })
  }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, description, category, date } = req.body

    if (!amount || !description || !date) {
      return res.status(400).json({ error: 'Amount, description and date are required.' })
    }

    const expenses = await readExpenses()
    const newExpense = {
      id: Date.now(),
      amount: Number(amount),
      description: String(description).trim(),
      category: String(category || 'other'),
      date: String(date),
    }

    expenses.push(newExpense)
    await writeExpenses(expenses)

    res.status(201).json(newExpense)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save expense' })
  }
})

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { amount, description, category, date } = req.body

    if (!id || !amount || !description || !date) {
      return res.status(400).json({ error: 'Valid id, amount, description and date are required.' })
    }

    const expenses = await readExpenses()
    const index = expenses.findIndex((item) => item.id === id)

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found.' })
    }

    const updatedExpense = {
      ...expenses[index],
      amount: Number(amount),
      description: String(description).trim(),
      category: String(category || 'other'),
      date: String(date),
    }

    expenses[index] = updatedExpense
    await writeExpenses(expenses)

    res.json(updatedExpense)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update expense' })
  }
})

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: 'Valid expense id is required.' })
    }

    const expenses = await readExpenses()
    const nextExpenses = expenses.filter((item) => item.id !== id)

    if (nextExpenses.length === expenses.length) {
      return res.status(404).json({ error: 'Expense not found.' })
    }

    await writeExpenses(nextExpenses)
    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`)
})
