
const EmptySubtasks = () => {
  return (
    <div className="py-6 flex flex-col items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-md">
      <p>Henüz alt görev bulunmuyor</p>
      <p className="mt-1 text-xs">Alt görev eklemek için "Alt Görev Ekle" butonunu kullanın</p>
    </div>
  );
};

export default EmptySubtasks;
