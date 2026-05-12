import { useState } from 'react';
import { Plus, X, Calendar, Clock, Trash2, Edit2, Check } from 'lucide-react-native';

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  emoji: string;
  notes?: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Papanicolau',
      date: '2026-03-22',
      time: '14:00',
      emoji: '🏥',
      notes: 'Clínica Dr. Silva'
    },
    {
      id: '2',
      title: 'Ginecologista - Dra. Ana',
      date: '2026-04-05',
      time: '09:30',
      emoji: '👩‍⚕️',
      notes: 'Consulta de rotina'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    emoji: '📅',
    notes: ''
  });

  const emojiOptions = [
    '🏥', '👩‍⚕️', '💊', '📅', '🩺', '💉', '🧪', '❤️', 
    '🌸', '💕', '🎀', '💝', '🩷', '🌺', '🧘‍♀️', '💆‍♀️',
    '🍎', '🥗', '💪', '🌙', '☀️', '⭐', '✨', '🌈'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Edit existing reminder
      setReminders(reminders.map(r => 
        r.id === editingId 
          ? { ...formData, id: editingId }
          : r
      ));
    } else {
      // Add new reminder
      const newReminder: Reminder = {
        ...formData,
        id: Date.now().toString()
      };
      setReminders([...reminders, newReminder]);
    }
    
    closeModal();
  };

  const handleEdit = (reminder: Reminder) => {
    setFormData({
      title: reminder.title,
      date: reminder.date,
      time: reminder.time,
      emoji: reminder.emoji,
      notes: reminder.notes || ''
    });
    setEditingId(reminder.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      emoji: '📅',
      notes: ''
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  const sortedReminders = [...reminders].sort((a, b) => 
    new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-24">
      {/* Animated decorative elements */}
      <div 
        className="pointer-events-none fixed left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-pink-300/30 to-purple-300/30 blur-3xl"
      />

      {/* Header */}
      <header 
        className="relative px-6 pb-6 pt-8"
      >
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
                <span>Meus Lembretes</span>
                <span className="text-2xl">📌</span>
              </h1>
              <p className="text-sm text-gray-600">Gerencie seus compromissos de saúde</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-xl shadow-pink-300/50"
            >
              <Plus className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Reminders List */}
      <main className="relative mx-auto max-w-md px-6">
        {sortedReminders.length === 0 ? (
          <div
            className="mt-20 text-center"
          >
            <div className="mb-4 text-6xl">📭</div>
            <p className="mb-2 font-bold text-gray-900">Nenhum lembrete ainda</p>
            <p className="text-sm text-gray-600">Adicione seu primeiro lembrete clicando no botão +</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReminders.map((reminder, index) => (
              <div
                key={reminder.id}
                className="group overflow-hidden rounded-3xl bg-white p-5 shadow-xl shadow-pink-200/40"
              >
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 shadow-xl shadow-purple-300/50"
                    >
                      <span className="text-3xl">{reminder.emoji}</span>
                    </div>
                    
                    <div className="flex-1">
                      <span className="mb-2 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-1 text-xs font-bold text-rose-700">
                        Lembrete
                      </span>
                      <h3 className="mb-2 font-bold text-gray-900">{reminder.title}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(reminder.date)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {reminder.time}
                        </p>
                        {reminder.notes && (
                          <p className="font-['Patrick_Hand'] text-base text-gray-700">{reminder.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(reminder)}
                        className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3"
                      >
                        <Edit2 className="h-5 w-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-3"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
          <>
            {/* Backdrop */}
            <div
              onClick={closeModal}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <div
              className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-6"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              <div className="flex max-h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                {/* Modal Header - Fixed */}
                <div className="flex-shrink-0 border-b border-gray-100 px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingId ? 'Editar Lembrete' : 'Novo Lembrete'}
                    </h2>
                    <button
                      onClick={closeModal}
                      className="rounded-full p-2 hover:bg-gray-100"
                    >
                      <X className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Form - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <form onSubmit={handleSubmit} className="space-y-4" id="reminder-form">
                    {/* Emoji Picker */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Ícone
                      </label>
                      <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
                        {emojiOptions.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormData({ ...formData, emoji })}
                            className={`flex-shrink-0 rounded-2xl p-3 text-2xl transition-all ${
                              formData.emoji === emoji
                                ? 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Título
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Consulta com ginecologista"
                        className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Data
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Horário
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Observações (opcional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ex: Levar exames anteriores"
                        rows={3}
                        className="w-full rounded-2xl bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 rounded-2xl bg-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 font-bold text-white shadow-lg shadow-pink-300/50 hover:shadow-xl"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Check className="h-5 w-5" />
                          {editingId ? 'Salvar' : 'Adicionar'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
}