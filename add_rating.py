import re

def add_rating():
    path = 'src/app/dashboard/autos/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Add Star to lucide-react import
    if "Star" not in text:
        text = text.replace('AlertCircle, FileBox', 'AlertCircle, FileBox, Star')
        
    old_func_start = """function AutoCard({ tech, onClick }: { tech: Technician; onClick: () => void }) {
  const getDocStatus = (url?: string) => {"""
    
    new_func_start = """function AutoCard({ tech, onClick }: { tech: Technician; onClick: () => void }) {
  const [rating, setRating] = useState(tech.rating || 0);

  const handleRate = async (e: React.MouseEvent, val: number) => {
    e.stopPropagation();
    setRating(val);
    const updated = { ...tech, rating: val };
    await supabase.from('tecnicos').update({ data: updated }).eq('id', tech.id);
  };

  const getDocStatus = (url?: string) => {"""

    text = text.replace(old_func_start, new_func_start)
    
    old_title = """          <div className="font-bold text-lg" style={{ color: "#f1f5f9", letterSpacing: "1px" }}>
            {tech.patente} <span className="text-sm font-normal text-slate-400 ml-2">{tech.modeloAuto} {tech.anioAuto}</span>
          </div>"""
          
    new_title = """          <div className="font-bold text-lg flex items-start justify-between" style={{ color: "#f1f5f9", letterSpacing: "1px" }}>
            <div>
              {tech.patente} <span className="text-sm font-normal text-slate-400 ml-2">{tech.modeloAuto} {tech.anioAuto}</span>
            </div>
            <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= rating ? "#fbbf24" : "transparent"}
                  color={star <= rating ? "#fbbf24" : "#475569"}
                  onClick={(e) => handleRate(e, star)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  className="hover:scale-110"
                />
              ))}
            </div>
          </div>"""

    text = text.replace(old_title, new_title)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

add_rating()
print("Added 5-star rating")
