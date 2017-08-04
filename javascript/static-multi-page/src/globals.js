if (process.env.NODE_ENV === 'development') { 
  if (module.hot)
    module.hot.accept()
}
