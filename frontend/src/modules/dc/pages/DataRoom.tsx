import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { LayoutGrid, AlertTriangle, RefreshCw } from 'lucide-react';
import DataRoom3D from '../../../modules/dc/components/DataRoom3D';

/** 检测浏览器是否支持 WebGL */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

export default function DataRoom() {
  const navigate = useNavigate();
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(checkWebGLSupport());
  }, []);

  // 检测中 → 显示加载
  if (webglOk === null) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d1825]">
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // 不支持 WebGL → 降级显示
  if (!webglOk) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1825] gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <p className="text-gray-300 text-sm">Your browser does not support WebGL, unable to display the 3D data center scene.</p>
        <p className="text-gray-500 text-xs">Please use the latest version of Chrome/Firefox/Edge.</p>
        <Button
          type="primary"
          icon={<LayoutGrid size={12} />}
          size="small"
          onClick={() => navigate('/dc-manage')}
        >
          Enter Data Center Management
        </Button>
      </div>
    );
  }

  return (
    <div className="big-screen-scope relative w-full h-full overflow-hidden">
      <DataRoom3D />
    </div>
  );
}
