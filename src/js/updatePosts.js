import loadRss from './loadRss.js'
import { differenceBy, isEmpty } from 'lodash'

const updatePosts = (state, timeout = 5000) => {
  if (state.rss.state === 'updating') return

  const feedList = state.rss.feeds
  const postsList = state.rss.posts

  const promises = feedList.map(f =>
    loadRss(f.url, state, 'updating')
      .then((parsed) => {
        const { feed, posts } = parsed

        const onlyNewPosts = differenceBy(posts, postsList, 'url')

        if (!isEmpty(onlyNewPosts)) {
          const updatedPostsList = onlyNewPosts.map(p => ({
            ...p,
            FEED_ID: feed.id,
          }))

          state.rss.posts = [
            ...updatedPostsList,
            ...state.rss.posts,
          ]

          state.rss.state = 'updated'

          return updatedPostsList
        }
      })
      .catch((err) => {
        console.error(`Error updating feed: ${f.url}`, err)
      }),
  )

  Promise.all(promises)
    .catch((err) => {
      console.error('Unexpected update error ', err)
    })
    .finally(() => {
      state.rss.state = 'idle'

      setTimeout(() => updatePosts(state), timeout)
    })
}

export default updatePosts
