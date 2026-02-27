import { useState, useRef } from 'react'
import axios from 'axios'
import Auth from './Auth'
import './App.css'

function App() {
  const [user, setUser] = useState<{ name: string, token: string } | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (token: string, userData: { name: string, id: string }) => {
    const session = { name: userData.name, token };
    setUser(session);
    localStorage.setItem('user', JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Auto-extract skills when JD changes
  const extractSkills = async (text: string) => {
    if (!text.trim()) {
      setExtractedSkills([]);
      return;
    }

    setExtracting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/extract-skills`, { text });
      setExtractedSkills(response.data.skills);
    } catch (error) {
      console.error("Skill extraction error:", error);
    } finally {
      setExtracting(false);
    }
  };

  const handleJDChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJobDescription(text);
  };

  // Trigger extraction on blur or button click for better UX
  const handleJDBlur = () => {
    extractSkills(jobDescription);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const uploadResumes = async () => {
    if (files.length === 0) {
      alert("Please select files first");
      return;
    }

    setUploading(true);
    try {
      // Mock Job ID for demonstration
      const mockJobId = "60d5ecb86d1f2e2d8c8b4567";
      const newResults: any[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobId', mockJobId);
        formData.append('jobDescription', jobDescription);

        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resumes/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newResults.push(response.data.resume);
      }

      setResults(prev => [...prev, ...newResults]);
      alert("All resumes analyzed successfully!");
      setFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading resumes. Make sure the backend is running.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Welcome, <strong>{user.name}</strong></span>
        <button className="btn-premium" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem' }} onClick={logout}>
          Logout
        </button>
      </div>

      <header style={{ textAlign: 'center', marginBottom: '4rem', animation: 'fadeIn 0.8s ease-out' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800' }}>AI Hiring Assistant</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Rank resumes and generate interview questions with production-grade AI intelligence.
        </p>
      </header>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card glass">
          <h2 style={{ fontSize: '1.5rem' }}>Upload Resumes</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Support for PDF and DOCX formats. Multi-file processing enabled.
          </p>

          <input
            type="file"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx"
          />

          <div
            style={{
              border: isDragging ? '2px solid var(--primary)' : '2px dashed var(--border)',
              borderRadius: '16px',
              padding: '3rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span style={{ fontSize: '2rem' }}>{uploading ? '⏳' : '📁'}</span>
            <p style={{ marginTop: '1rem', fontWeight: '500' }}>
              {files.length > 0 ? `${files.length} files selected` : 'Drag & drop resumes here'}
            </p>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '1rem', maxHeight: '100px', overflowY: 'auto', textAlign: 'left' }}>
              {files.map((file: File, idx: number) => (
                <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  ✓ {file.name}
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-premium"
            style={{ width: '100%', marginTop: '1.5rem', opacity: uploading ? 0.7 : 1 }}
            onClick={uploadResumes}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Start Ranking'}
          </button>
        </div>

        <div className="card glass">
          <h2 style={{ fontSize: '1.5rem' }}>Job Description</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Enter the job criteria to refine the ranking algorithm.
          </p>
          <textarea
            className="input-premium"
            placeholder="Paste job description here..."
            style={{ minHeight: '150px', resize: 'vertical' }}
            value={jobDescription}
            onChange={handleJDChange}
            onBlur={handleJDBlur}
          />
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {extracting ? (
              <span className="badge badge-warning">Extracting skills...</span>
            ) : extractedSkills.length > 0 ? (
              extractedSkills.map((skill, i) => (
                <span key={i} className="badge badge-success">{skill}</span>
              ))
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Skills will appear here...</span>
            )}
          </div>
        </div>
      </div>

      <section style={{ marginTop: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '2rem' }}>Real-time Results</h2>
          {uploading && <span className="badge badge-warning">Analyzing...</span>}
        </div>

        <div className="glass" style={{ padding: '0', marginTop: '1.5rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Candidate</th>
                <th style={{ padding: '1rem' }}>Match Score</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {uploading ? 'Processing resumes...' : 'No resumes analyzed yet. Upload to see results!'}
                  </td>
                </tr>
              ) : (
                results.map((res: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600' }}>{res.candidateName}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100px', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${res.score}%`, height: '100%', background: 'var(--primary)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{res.score}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-success">{res.status}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => { setSelectedResult(res); setShowModal(true); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        View Questions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Questions Modal */}
      {showModal && selectedResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card glass" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{selectedResult.candidateName}'s Analysis</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Reasoning</h3>
              <p style={{ color: 'var(--text-muted)' }}>{selectedResult.reasoning}</p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem' }}>Sugguested Interview Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedResult.interviewQuestions.map((q: string, i: number) => (
                  <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.95rem' }}>{i + 1}. {q}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-premium" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setShowModal(false)}>
              Close Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
