import { Card, Row, Col, Statistic, Spin, Empty } from 'antd';
import { Server, Monitor, Wifi, LayoutGrid, Plus, Thermometer, AlertTriangle, Clock } from 'lucide-react';
import type { OverviewData, Rack, Room } from './types';

/**
 * Overview 页面使用的机柜精简类型（来源于后端 overview API 的 rackData 元素）
 */
interface RackSummary {
  id: string;
  name: string;
  room_id?: string;
  total_u?: number;
  used_u?: number;
  [key: string]: unknown;
}

interface OverviewTabProps {
  overview: OverviewData | null;
  rooms: Room[];
  racks: Rack[];
  rackAlertMap: Record<string, number>;
  onAddRoom: () => void;
  onSelectRack: (rack: Rack) => void;
}

export default function OverviewTab({
  overview, rooms, racks, rackAlertMap,
  onAddRoom, onSelectRack,
}: OverviewTabProps) {
  if (!overview) return <Spin className="flex justify-center py-20" />;

  // 空库状态
  if (overview.isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6">
          <Server size={40} className="text-text-tertiary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">No data center assets</h3>
        <p className="text-sm text-text-secondary mb-6 text-center max-w-md">
          No room, rack, or device data found in the current database. Please manually add real assets to start.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors flex items-center gap-1.5"
          onClick={onAddRoom}
        >
          <Plus size={14} /> Manually Add Room
        </button>
      </div>
    );
  }

  const { summary, rackData } = overview;
  const roomsGrouped: Record<string, RackSummary[]> = {};
  (rackData || []).forEach((r) => {
    const rack = r as RackSummary;
    const roomKey = rack.room_id ?? 'unknown';
    if (!roomsGrouped[roomKey]) roomsGrouped[roomKey] = [];
    roomsGrouped[roomKey].push(rack);
  });

  return (
    <div>
      {/* Stat cards */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={12} sm={8} md={6} lg={3}><Card size="small"><Statistic title="Data center" value={summary?.totalRooms || 0} prefix={<Monitor size={14} />} /></Card></Col>
        <Col xs={12} sm={8} md={6} lg={3}><Card size="small"><Statistic title="Cabinet/Rack" value={summary?.totalRacks || 0} prefix={<LayoutGrid size={14} />} /></Card></Col>
        <Col xs={12} sm={8} md={6} lg={3}><Card size="small"><Statistic title="Device" value={summary?.totalDevices || 0} prefix={<Server size={14} />} /></Card></Col>
        <Col xs={12} sm={8} md={6} lg={3}><Card size="small"><Statistic title="Online" value={summary?.onlineDevices || 0} valueStyle={{ color: '#52c41a' }} prefix={<Wifi size={14} />} /></Card></Col>
        <Col xs={12} sm={8} md={6} lg={3}><Card size="small"><Statistic title="Alert" value={summary?.alertDevices || 0} valueStyle={{ color: summary?.alertDevices ? '#ff4d4f' : undefined }} prefix={<AlertTriangle size={14} />} /></Card></Col>
        <Col xs={12} sm={8} md={6} lg={3}><Card size="small"><Statistic title="Offline" value={summary?.offlineDevices || 0} valueStyle={{ color: '#ff4d4f' }} prefix={<Clock size={14} />} /></Card></Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Temperature"
              value={summary?.avgTemp ? `${summary.avgTemp.toFixed(1)}°C` : '—'}
              valueStyle={{
                color: summary?.avgTemp && (summary.avgTemp < 18 || summary.avgTemp > 28) ? '#ff4d4f' : '#52c41a',
              }}
              prefix={<Thermometer size={14} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Humidity"
              value={summary?.avgHumidity ? `${summary.avgHumidity.toFixed(1)}%` : '—'}
              valueStyle={{
                color: summary?.avgHumidity && (summary.avgHumidity < 30 || summary.avgHumidity > 70) ? '#ff4d4f' : '#52c41a',
              }}
              prefix={<Thermometer size={14} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 机柜热力图 */}
      <Card
        size="small"
        title={<span className="text-sm">Rack Heatmap &nbsp;<span className="text-text-tertiary text-xs font-normal">Darker color indicates higher utilization</span></span>}
        className="mb-6"
      >
        {Object.keys(roomsGrouped).length === 0 ? (
          <Empty description="No cabinet data" className="py-8" />
        ) : (
          <div className="space-y-4">
            {Object.entries(roomsGrouped).map(([roomId, roomRacks]) => {
              const roomInfo = rooms.find((r) => r.id === roomId) || rooms.find((r) => r.label === roomId);
              return (
                <div key={roomId}>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">
                    {roomInfo?.label || roomInfo?.name || roomId}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1">
                    {roomRacks.map((rack) => {
                      const totalU = rack.total_u || 42;
                      const usedU = rack.used_u || 0;
                      const util = totalU > 0 ? Math.round((usedU / totalU) * 100) : 0;
                      const alertCount = rackAlertMap[rack.id] || 0;

                      let bg = 'bg-gray-800';
                      if (util > 85) bg = 'bg-red-900/70';
                      else if (util > 70) bg = 'bg-orange-800/60';
                      else if (util > 40) bg = 'bg-yellow-800/40';
                      else if (util > 0) bg = 'bg-green-800/40';

                      return (
                        <div
                          key={rack.id}
                          className={`${bg} border border-gray-700/50 rounded cursor-pointer
                            hover:border-cyan-500/60 hover:shadow-[0_0_10px_rgba(0,200,255,0.15)]
                            transition-all text-center py-1.5 px-1 relative group`}
                          onClick={() => onSelectRack(rack as unknown as Rack)}
                        >
                          <div className="text-[10px] text-text-secondary truncate" title={rack.name}>
                            {rack.name}
                          </div>
                          <div className="text-xs font-bold font-mono mt-0.5">{util}%</div>
                          <div className="text-[8px] text-text-tertiary">{usedU}/{totalU}U</div>
                          {alertCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg">
                              {alertCount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 图例 */}
      <div className="flex items-center gap-3 text-[10px] text-text-tertiary px-1">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-800 border border-gray-700" /> Idle</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-800/40 border border-gray-700" /> &lt;40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-800/40 border border-gray-700" /> 40-70%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-800/60 border border-gray-700" /> 70-85%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-900/70 border border-gray-700" /> &gt;85%</span>
      </div>
    </div>
  );
}
