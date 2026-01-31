
import { Handle, Position } from 'reactflow';

export default function StepNode({ data }) {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-indigo-200 w-64">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="rounded-full w-3 h-3 bg-indigo-500" />
                    <div className="ml-2">
                        <div className="text-sm font-bold text-gray-900">{data.label}</div>
                        <div className="text-xs text-gray-500">{data.type}</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); data.onPreview && data.onPreview(data); }}
                    className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                    title="Preview Step"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>

            <Handle type="target" position={Position.Top} className="w-16 !bg-indigo-300" />
            <Handle type="source" position={Position.Bottom} className="w-16 !bg-indigo-500" />
        </div>
    );
}
