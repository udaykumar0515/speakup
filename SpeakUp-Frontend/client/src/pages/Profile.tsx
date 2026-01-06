import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useAptitudeHistory, useInterviewHistory, useGdHistory } from "@/hooks/use-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User as UserIcon, Briefcase, Calendar, MapPin, Edit2, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AVATARS = [
  { id: 'm1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'm2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster' },
  { id: 'm3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper' },
  { id: 'f1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly' },
  { id: 'f2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { id: 'f3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala' },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    occupation: user?.occupation || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const { data: aptitudeData, isLoading: aptLoading } = useAptitudeHistory(user?.id || 0);
  const { data: interviewData, isLoading: intLoading } = useInterviewHistory(user?.id || 0);
  const { data: gdData, isLoading: gdLoading } = useGdHistory(user?.id || 0);

  if (!user) return null;

  const handleSave = async () => {
    await updateProfile({
      ...editData,
      age: editData.age ? Number(editData.age) : null
    });
    setIsEditing(false);
  };

  const handleAvatarSelect = (url: string) => {
    setEditData({ ...editData, avatarUrl: url });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-card p-8 rounded-2xl border shadow-sm relative group">
          <div className="absolute top-4 right-4">
            <Button 
              variant={isEditing ? "default" : "ghost"} 
              size="sm" 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="gap-2"
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
            {isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(false)} 
                className="ml-2"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                <AvatarImage src={editData.avatarUrl || user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute bottom-0 right-0 rounded-full shadow-md w-10 h-10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Choose an Avatar</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                      {AVATARS.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => handleAvatarSelect(avatar.url)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all p-1 ${
                            editData.avatarUrl === avatar.url ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                          }`}
                        >
                          <img src={avatar.url} alt="Avatar option" className="w-full aspect-square" />
                          {editData.avatarUrl === avatar.url && (
                            <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={editData.name} 
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Select 
                      value={editData.occupation} 
                      onValueChange={(val) => setEditData({...editData, occupation: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="professional">Working Professional</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input 
                      type="number"
                      value={editData.age} 
                      onChange={(e) => setEditData({...editData, age: e.target.value})}
                      placeholder="Age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select 
                      value={editData.gender} 
                      onValueChange={(val) => setEditData({...editData, gender: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-4xl font-bold font-display tracking-tight">{user.name}</h1>
                    <p className="text-xl text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      {user.occupation || 'Occupation not set'}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {user.age ? `${user.age} years old` : 'Age not set'}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium capitalize">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      {user.gender || 'Gender not set'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* History Tabs */}
        <Tabs defaultValue="aptitude" className="w-full">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="aptitude" className="rounded-lg">Aptitude History</TabsTrigger>
            <TabsTrigger value="interview" className="rounded-lg">Interview History</TabsTrigger>
            <TabsTrigger value="gd" className="rounded-lg">GD History</TabsTrigger>
          </TabsList>

          <TabsContent value="aptitude">
            <Card>
              <CardHeader>
                <CardTitle>Aptitude Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {aptLoading ? (
                  <Loader2 className="animate-spin" />
                ) : aptitudeData?.length === 0 ? (
                  <p className="text-muted-foreground">No aptitude tests taken yet.</p>
                ) : (
                  <div className="space-y-4">
                    {aptitudeData?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-bold capitalize">{item.topic}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt!), 'PPp')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{item.score}%</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="interview">
            <Card>
              <CardHeader>
                <CardTitle>Interview Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {intLoading ? (
                  <Loader2 className="animate-spin" />
                ) : interviewData?.length === 0 ? (
                  <p className="text-muted-foreground">No mock interviews taken yet.</p>
                ) : (
                  <div className="space-y-4">
                    {interviewData?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-bold">Mock Interview</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt!), 'PPp')}</p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div>
                            <p className="font-bold">{item.communicationScore}</p>
                            <p className="text-[10px] text-muted-foreground">Comm.</p>
                          </div>
                          <div>
                            <p className="font-bold">{item.confidenceScore}</p>
                            <p className="text-[10px] text-muted-foreground">Conf.</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gd">
            <Card>
              <CardHeader>
                <CardTitle>GD Participation</CardTitle>
              </CardHeader>
              <CardContent>
                {gdLoading ? (
                  <Loader2 className="animate-spin" />
                ) : gdData?.length === 0 ? (
                  <p className="text-muted-foreground">No GD sessions attended yet.</p>
                ) : (
                  <div className="space-y-4">
                    {gdData?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-bold">{item.topic}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt!), 'PPp')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{item.score}</p>
                          <p className="text-xs text-muted-foreground">Perf. Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
