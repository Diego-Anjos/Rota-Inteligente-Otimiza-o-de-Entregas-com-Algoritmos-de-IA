import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFilesAttached: (files: File[]) => void;
  attachedFiles: File[] | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesAttached, attachedFiles }) => {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAttached(acceptedFiles);
  }, [onFilesAttached]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  });

  return (
    <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}>
        <input {...getInputProps()} />
        <p className="text-slate-600 dark:text-slate-400">
          {isDragActive
            ? 'Solte os arquivos aqui...'
            : 'Arraste os 3 arquivos CSV aqui (pontos, rotas, pedidos), ou clique para selecionar.'}
        </p>
      </div>
       {attachedFiles && attachedFiles.length > 0 && (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">Arquivos Anexados:</h4>
          <ul className="list-disc list-inside">
            {attachedFiles.map(file => (
              <li key={file.name}>
                {file.name} <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(2)} KB)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;