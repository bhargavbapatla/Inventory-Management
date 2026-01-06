import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';

type EChartProps = {
  option: echarts.EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  chartSettings?: Parameters<typeof echarts.init>[2];
  optionSettings?: Parameters<echarts.ECharts['setOption']>[1];
  events?: Record<string, (params: unknown) => void>;
};

const defaultStyle: React.CSSProperties = { width: '100%', height: 320 };

const EChart = ({
  option,
  style = defaultStyle,
  className,
  chartSettings,
  optionSettings,
  events = {},
}: EChartProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const onResize = useMemo(() => {
    let timeoutId: number | undefined;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (ref.current) {
          const instance = echarts.getInstanceByDom(ref.current);
          instance && instance.resize();
        }
      }, 100);
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const instance = echarts.init(ref.current, undefined, chartSettings);

    Object.entries(events).forEach(([eventName, handler]) => {
      instance.on(eventName, (params) => handler(params));
    });

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      instance.dispose();
    };
  }, [chartSettings, events, onResize]);

  useEffect(() => {
    if (!ref.current) return;
    const instance = echarts.getInstanceByDom(ref.current) || echarts.init(ref.current, undefined, chartSettings);
    instance.setOption(option, optionSettings);
  }, [option, optionSettings, chartSettings]);

  return <div ref={ref} style={style} className={className} />;
};

export default EChart;
