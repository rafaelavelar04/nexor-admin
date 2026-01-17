import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JsonDiffViewerProps {
  beforeData: object | null;
  afterData: object | null;
}

const JsonDiffViewer = ({ beforeData, afterData }: JsonDiffViewerProps) => {
  if (!beforeData && !afterData) {
    return <p className="text-sm text-muted-foreground">Nenhum dado de alteração disponível.</p>;
  }

  const allKeys = new Set([...Object.keys(beforeData || {}), ...Object.keys(afterData || {})]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Antes</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          {beforeData ? Array.from(allKeys).map(key => {
            const value = JSON.stringify(beforeData[key as keyof typeof beforeData], null, 2);
            const hasChanged = JSON.stringify(beforeData[key as keyof typeof beforeData]) !== JSON.stringify(afterData?.[key as keyof typeof afterData]);
            return (
              <div key={`before-${key}`} className={hasChanged ? 'bg-red-500/10 p-2 rounded' : 'p-2'}>
                <strong className="text-foreground">{key}:</strong>
                <pre className="whitespace-pre-wrap break-all text-muted-foreground">{value}</pre>
              </div>
            );
          }) : <p className="text-muted-foreground p-2">N/A</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Depois</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          {afterData ? Array.from(allKeys).map(key => {
            const value = JSON.stringify(afterData[key as keyof typeof afterData], null, 2);
            const hasChanged = JSON.stringify(beforeData?.[key as keyof typeof beforeData]) !== JSON.stringify(afterData[key as keyof typeof afterData]);
            return (
              <div key={`after-${key}`} className={hasChanged ? 'bg-green-500/10 p-2 rounded' : 'p-2'}>
                <strong className="text-foreground">{key}:</strong>
                <pre className="whitespace-pre-wrap break-all text-muted-foreground">{value}</pre>
              </div>
            );
          }) : <p className="text-muted-foreground p-2">N/A</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonDiffViewer;