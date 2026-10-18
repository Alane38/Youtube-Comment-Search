/*
  WRITTEN BY NEWALFOX 
  & 
  Based on the project of MiladSadeghi - https://github.com/MiladSadeghi/Youtube-Comment-Picker
*/

const searchCommentBtn = document.querySelector('#searchComment')
const correctLink = document.getElementById('correctLink')
const correctWord = document.getElementById('correctWord')
const wrongLink = document.getElementById('wrongLink')
const wrongWord = document.getElementById('wrongWord')
const CommentCount = document.querySelector('#CommentCount')
const showResultSection = document.querySelector('#Enter')

// ⚠️ Mettre ta vraie clé API
const apiToken = "AIzaSyDYHHLyTY8hkpOOrdBUui-Z-Q8qmNo5MAw"

class Youtube {
  constructor() {
    this.videoID = null
    this.searchWord = null
  }

  getID(link) {
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))(([\w-]{11}))(?:\S+)?$/
    const result = link.match(regex)
    return result ? result[1] : null
  }

  checkLink() {
    const link = document.querySelector('#linkInput').value
    const id = this.getID(link)
    if (id) {
      this.videoID = id
      new bootstrap.Toast(correctLink).show()
      return true
    } else {
      new bootstrap.Toast(wrongLink).show()
      return false
    }
  }

  checkWord() {
    const word = document.querySelector('#searchWord').value
    if (word.trim() !== "") {
      this.searchWord = word.toLowerCase()
      new bootstrap.Toast(correctWord).show()
      return true
    } else {
      new bootstrap.Toast(wrongWord).show()
      return false
    }
  }

  async fetchComments(videoId) {
    let comments = []
    let nextPageToken = null

    do {
      const url = new URL("https://youtube.googleapis.com/youtube/v3/commentThreads")
      url.search = new URLSearchParams({
        part: "snippet,replies",
        videoId: videoId,
        key: apiToken,
        maxResults: 100,
        pageToken: nextPageToken || ""
      })

      const res = await fetch(url)
      const data = await res.json()

      if (data.error) {
        console.error("API Error:", data.error)
        break
      }

      comments.push(...data.items)
      CommentCount.textContent = parseInt(CommentCount.textContent) + data.items.length

      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return comments
  }

  highlightWord(word, text) {
    const regex = new RegExp(word, "gi")
    return text.replace(regex, `<span class="highlighted">$&</span>`)
  }

  showResult(comments) {
    showResultSection.innerHTML = ""
    let found = 0

    comments.forEach(comment => {
      const top = comment.snippet.topLevelComment.snippet
      const text = top.textOriginal

      if (text.toLowerCase().includes(this.searchWord)) {
        found++
        showResultSection.innerHTML += `
          <hr class="text-white"/>
          <div class="container">
            <div class="mb-3">
              <img class="img-fluid rounded-circle border border-2 border-grey" src="${top.authorProfileImageUrl}">
            </div>
            <div class="mb-3">
              <a class="text-white fs-4" target="_blank" href="${top.authorChannelUrl}">
                ${top.authorDisplayName} <i class="bi bi-box-arrow-up-right fs-6"></i>
              </a>
            </div>
            <div class="container">
              <p class="text-white m-0">${this.highlightWord(this.searchWord, text)}</p>
              <div class="d-flex gap-2 mt-2">
                <img src="assets/images/heart.png" alt="like" height="25" width="25"/>
                <p>${top.likeCount}</p>
              </div>
            </div>
          </div>
        `
      }

      if (comment.replies) {
        comment.replies.comments.forEach(rep => {
          const replyText = rep.snippet.textOriginal
          if (replyText.toLowerCase().includes(this.searchWord)) {
            found++
            showResultSection.innerHTML += `
              <div class="container mb-4 mt-5">
                <h5 class="text-success">Reply to ${top.authorDisplayName}:<h5/>
                <div class="container">
                  <div class="mb-3">
                    <img class="img-fluid rounded-2" src="${rep.snippet.authorProfileImageUrl}">
                  </div>
                  <div class="mb-3">
                    <a class="text-white fs-4" target="_blank" href="${rep.snippet.authorChannelUrl}">
                      ${rep.snippet.authorDisplayName} <i class="bi bi-box-arrow-up-right fs-6"></i>
                    </a>
                  </div>
                  <div class="container">
                    <p class="text-white m-0">${this.highlightWord(this.searchWord, replyText)}</p>
                    <div class="d-flex gap-2 mt-2">
                      <img src="assets/images/heart.png" alt="like" height="25" width="25"/>
                      <p>${rep.snippet.likeCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        })
      }
    })

    if (found === 0) {
      showResultSection.innerHTML = `<h5 class="text-white text-center">Nothing found :c</h5>`
    }
  }

  async searchComment() {
    CommentCount.textContent = 0
    if (this.checkLink() && this.checkWord()) {
      const comments = await this.fetchComments(this.videoID)
      this.showResult(comments)
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const youtube = new Youtube()
  searchCommentBtn.addEventListener("click", () => youtube.searchComment())
})
