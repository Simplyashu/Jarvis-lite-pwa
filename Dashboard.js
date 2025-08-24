import Notes from './Notes';
import Todo from './Todo';
import Reminders from './Reminders';
import MathSolver from './MathSolver';
import Flashcards from './Flashcards';
import Pomodoro from './Pomodoro';

export default function Dashboard() {
  // Example: Fetch user data, assignments, greetings, etc.
  // This is where the "Daily Summary Card" lives.
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Good morning, sir 👋</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Notes />
        <Todo />
        <Reminders />
        <MathSolver />
        <Flashcards />
        <Pomodoro />
      </div>
      {/* Add ProgressDashboard, SummaryCard, etc. */}
    </div>
  );
}