import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Code, ExternalLink, Settings, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Project } from "@shared/schema";

interface EmbedCodeGeneratorProps {
  project: Project;
}

export default function EmbedCodeGenerator({ project }: EmbedCodeGeneratorProps) {
  const { toast } = useToast();
  
  const [embedSettings, setEmbedSettings] = useState({
    theme: "light",
    layout: "grid",
    limit: "10",
    width: "100%",
    height: "600px",
  });

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${project.id}?theme=${embedSettings.theme}&layout=${embedSettings.layout}&limit=${embedSettings.limit}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${embedSettings.width}"
  height="${embedSettings.height}"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  title="${project.name} Testimonials">
</iframe>`;

  const javascriptCode = `<!-- Testimonial Widget -->
<div id="testimo-widget-${project.id}"></div>
<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.width = '${embedSettings.width}';
  iframe.height = '${embedSettings.height}';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.title = '${project.name} Testimonials';
  document.getElementById('testimo-widget-${project.id}').appendChild(iframe);
})();
</script>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} code copied to clipboard`,
    });
  };

  const openPreview = () => {
    window.open(embedUrl, '_blank', 'width=800,height=600');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Embeddable Widget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Generate embed codes to display your testimonials on any website. 
            Customize the appearance and copy the code to paste into your site.
          </AlertDescription>
        </Alert>

        {/* Customization Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={embedSettings.theme} onValueChange={(value) => 
              setEmbedSettings({...embedSettings, theme: value})
            }>
              <SelectTrigger id="theme" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="layout">Layout</Label>
            <Select value={embedSettings.layout} onValueChange={(value) => 
              setEmbedSettings({...embedSettings, layout: value})
            }>
              <SelectTrigger id="layout" data-testid="select-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Max Testimonials</Label>
            <Select value={embedSettings.limit} onValueChange={(value) => 
              setEmbedSettings({...embedSettings, limit: value})
            }>
              <SelectTrigger id="limit" data-testid="select-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              value={embedSettings.width}
              onChange={(e) => setEmbedSettings({...embedSettings, width: e.target.value})}
              placeholder="100% or 800px"
              data-testid="input-width"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              value={embedSettings.height}
              onChange={(e) => setEmbedSettings({...embedSettings, height: e.target.value})}
              placeholder="600px"
              data-testid="input-height"
            />
          </div>

          <div className="flex items-end">
            <Button onClick={openPreview} variant="outline" className="w-full" data-testid="button-preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Preview URL */}
        <div className="space-y-2">
          <Label>Preview URL</Label>
          <div className="flex gap-2">
            <Input 
              value={embedUrl} 
              readOnly 
              className="font-mono text-sm"
              data-testid="input-preview-url"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(embedUrl, "URL")}
              data-testid="button-copy-url"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openPreview}
              data-testid="button-open-preview"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Embed Code Tabs */}
        <Tabs defaultValue="iframe" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="iframe" data-testid="tab-iframe">
              <Badge variant="secondary" className="mr-2">Recommended</Badge>
              iframe
            </TabsTrigger>
            <TabsTrigger value="javascript" data-testid="tab-javascript">JavaScript</TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>iframe Embed Code</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(iframeCode, "iframe")}
                  data-testid="button-copy-iframe"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={iframeCode}
                readOnly
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-iframe-code"
              />
              <p className="text-sm text-muted-foreground">
                Simple iframe embed - works on all websites. Just paste this code where you want the testimonials to appear.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="javascript" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JavaScript Embed Code</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(javascriptCode, "JavaScript")}
                  data-testid="button-copy-javascript"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={javascriptCode}
                readOnly
                rows={12}
                className="font-mono text-sm"
                data-testid="textarea-javascript-code"
              />
              <p className="text-sm text-muted-foreground">
                JavaScript embed with dynamic loading. Place this code in your HTML where you want the testimonials to display.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Usage Instructions */}
        <Alert>
          <AlertDescription>
            <strong>How to use:</strong> Copy the embed code above and paste it into your website's HTML. 
            The testimonials will automatically display with your current published testimonials. 
            Updates to your testimonials will be reflected immediately on your embedded widgets.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}