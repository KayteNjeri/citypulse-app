import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

describe('CityPulse UI Components', () => {
  it('renders the loading spinner', () => {
    render(<LoadingSpinner message="Loading events..." />)

    expect(screen.getByRole('status'))
      .toHaveTextContent('Loading events...')
  })

  it('displays an error and calls retry', () => {
    const onRetry = vi.fn()

    render(
      <ErrorMessage
        message="Could not load events."
        onRetry={onRetry}
      />
    )

    expect(screen.getByRole('alert'))
      .toHaveTextContent('Could not load events.')

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders and closes the confirmation dialog', () => {
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete this plan?"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('alertdialog'))
      .toHaveTextContent('Delete this plan?')

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('renders the empty state', () => {
    const onAction = vi.fn()

    render(
      <EmptyState
        type="events"
        title="No events found"
        message="Try changing your search."
        actionLabel="Explore events"
        onAction={onAction}
      />
    )

    expect(screen.getByText('No events found')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /explore events/i }))

    expect(onAction).toHaveBeenCalledOnce()
  })
})