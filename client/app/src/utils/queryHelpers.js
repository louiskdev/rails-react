const commentObject = `
  author {
    id
    username
    avatar_url(version: "micro")
  }
  body
  commentable_id
  commentable_type
  created_at
  id
  liked
  likes_count
  subject
  text
  title
  user_id
  link_preview {
    description
    id
    picture_url
    title
    url
  }
  medium {
    type
    id
    picture_url
    thumb_url
    video_links
    recoding_job_id
  }
  comments {
    edges {
      cursor  #pagination field
      node {
        author {
          id
          username
          avatar_url(version: "micro")
        }
        body
        commentable_id
        commentable_type
        created_at
        id
        liked
        likes_count
        subject
        text
        title
        user_id
        link_preview {
          description
          id
          picture_url
          title
          url
        }
        medium {
          type
          id
          picture_url
          thumb_url
          video_links
          recoding_job_id
        }
      }
    }
  }
`;

export const feedItemResult = `
  id
  name
  user_friendly_name
  shared
  user_id
  bubble_id
  object_type
  object_id
  feed
  privacy
  created_at
  author {
    id
    username
    avatar_url(version: "micro")
  }
  originalAuthor {
    id
    username
    avatar_url(version: "micro")
  }
  bubble {
    name
    permalink
    description
    avatar_url(version: "micro")
  }
  multi_preview_media_count
  multi_preview_media(first: 5) {
    edges {
      node {
        id
        thumb_url #250x250
        small_url: picture_url(version: "small_square") #180x180
        big_url: picture_url(version: "big_square") #500x500
        landscape_url: picture_url(version: "lscape") #500x250
        small_lscape_url: picture_url(version: "small_lscape") #250x180
        original_url: picture_url # max 1200x1200
        album_id
      }
    }
  }
  o_note {
    author {
      id
      username
      avatar_url(version: "micro")
    }
    comments_count
    comments(last: 10) {
      edges {
        node {
          ${commentObject}
        }
      }
    }
    created_at
    id
    liked
    likes_count
    likers(limit: 10) {
      other_likers_count
      edges {
        node {
          username
          first_name
        }
      }
    }
    link_preview {
      description
      id
      picture_url
      title
      url
    }
    media {
      edges {
        node {
          id
          type
          thumb_url #250x250
          small_url: picture_url(version: "small_square") #180x180
          big_url: picture_url(version: "big_square") #500x500
          landscape_url: picture_url(version: "lscape") #500x250
          small_lscape_url: picture_url(version: "small_lscape") #250x180
          original_url: picture_url # max 1200x1200
          recoding_job_id
          user_id
          video_links
        }
      }
    }
    raters_count
    rating
    text
    updated_at
    user_id
    user_rating
    visits_count
  }

  o_post {
    author {
      id
      username
      avatar_url(version: "micro")
    }
    comments_count
    comments(last: 10) {
      edges {
        node {
          ${commentObject}
        }
      }
    }
    created_at
    id
    liked
    likes_count
    likers(limit: 10) {
      other_likers_count
      edges {
        node {
          username
          first_name
        }
      }
    }
    link_preview {
      description
      id
      picture_url
      title
      url
    }
    media {
      edges {
        node {
          id
          type
          thumb_url #250x250
          small_url: picture_url(version: "small_square") #180x180
          big_url: picture_url(version: "big_square") #500x500
          landscape_url: picture_url(version: "lscape") #500x250
          small_lscape_url: picture_url(version: "small_lscape") #250x180
          original_url: picture_url # max 1200x1200
          recoding_job_id
          user_id
          video_links
        }
      }
    }
    raters_count
    rating
    text
    updated_at
    user_id
    user_rating
    visits_count
  }

  o_bubble {
    name
    permalink
    avatar_url
  }

  o_medium {
    comments_count
    comments(last: 10) {
      edges {
        node {
          ${commentObject}
        }
      }
    }
    id
    liked
    likes_count
    likers(limit: 10) {
      other_likers_count
      edges {
        node {
          username
          first_name
        }
      }
    }
    big_url: picture_url(version: "big_square") #500x500
    picture_url
    recoding_job_id
    type
    user_id
    video_links
    visits_count
  }

  o_album {
    avatar_url(version: "thumb")
    comments_count
    comments(last: 10) {
      edges {
        node {
          ${commentObject}
        }
      }
    }
    id
    liked
    likes_count
    likers(limit: 10) {
      other_likers_count
      edges {
        node {
          username
          first_name
        }
      }
    }
    description
    name
  }

  o_event {
    id
    address
    description
    name
    start_date
    avatar_url(version: "thumb")
  }
`;

export const uploadedFilesResult = `
  id
  owner_id
  bubble_id
  url
  filename
  content_type
  downloads
  created_at
  uploader {
    id
    username
    avatar_url(version: "micro")
  }
  bubble {
    id
    permalink
    name
    avatar_url(version: "micro")
  }
`;

export const documentResult = `
  id
  owner_id
  bubble_id
  title
  content
  created_at
  updated_at
  owner {
    id
    username
    avatar_url
  }
  bubble {
    id
    name
    avatar_url
  }
`;
