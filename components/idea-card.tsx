"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Eye, MoreHorizontal } from "lucide-react"
import { IdeaWithDetails } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

interface IdeaCardProps {
  idea: IdeaWithDetails
  currentUserId?: string
}

export function IdeaCard({ idea, currentUserId }: IdeaCardProps) {
  const [isLiked, setIsLiked] = useState(idea.user_has_liked)
  const [likeCount, setLikeCount] = useState(idea.likes || 0)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    if (!currentUserId || isLoading) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase.rpc('toggle_like', {
        idea_id: idea.id
      })

      if (error) throw error

      setIsLiked(!isLiked)
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: idea.title,
          text: idea.summary,
          url: `${window.location.origin}/ideas/${idea.id}`
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/ideas/${idea.id}`)
    }
  }

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_counter', {
        counter_name: 'view_count',
        row_id: idea.id
      })
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={idea.author_profile.avatar_url || ''} />
              <AvatarFallback>
                {idea.author_profile.full_name?.[0] || idea.author_profile.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link 
                href={`/profile/${idea.author_profile.username}`}
                className="font-semibold hover:underline"
              >
                {idea.author_profile.full_name || idea.author_profile.username}
              </Link>
              <p className="text-sm text-muted-foreground">
                @{idea.author_profile.username} • {formatDistanceToNow(new Date(idea.created_at || ''))} ago
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link 
          href={`/ideas/${idea.id}`}
          onClick={incrementViewCount}
          className="block"
        >
          <div className="space-y-3">
            {idea.cover_img && (
              <div className="relative aspect-video rounded-md overflow-hidden">
                <img 
                  src={idea.cover_img} 
                  alt={idea.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            <div>
              <h3 className="text-xl font-bold hover:underline mb-2">
                {idea.title}
              </h3>
              <p className="text-muted-foreground line-clamp-3">
                {idea.summary}
              </p>
            </div>

            {idea.tags && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {idea.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {idea.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{idea.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <Badge variant="outline" className="w-fit">
              {idea.category}
            </Badge>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant={isLiked ? "default" : "ghost"}
              size="sm"
              onClick={handleLike}
              disabled={!currentUserId || isLoading}
              className="flex items-center space-x-1"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link 
                href={`/ideas/${idea.id}#comments`}
                className="flex items-center space-x-1"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{idea.total_comments}</span>
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          </div>

          <div className="flex items-center text-sm text-muted-foreground space-x-1">
            <Eye className="h-4 w-4" />
            <span>{idea.view_count || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}